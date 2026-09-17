import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../core/firebase/config";
import { Link } from "react-router-dom";
import { CarFront, Search, MapPin, Building } from "lucide-react";
import { ThemeToggle } from "../../shared/components/ThemeToggle";

interface Company {
  id: string;
  name: string;
  businessName: string;
  contactEmail: string;
  phone: string;
  country: string;
}

export const CompanyDirectory = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "companies"));
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Company));
        setCompanies(data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.country && c.country.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background flex flex-col transition-colors duration-300">
      <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md">
            <Building size={22} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
              Directorio Nacional
            </h1>
            <p className="text-xs text-muted-foreground">Encuentra tu Rent-A-Car ideal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-6xl mx-auto w-full">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-4xl font-extrabold text-foreground mb-4">Marketplace de Vehículos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explora las mejores agencias de renta de autos. Elige una empresa para ver su flota disponible y reservar en tiempo real.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="glass flex items-center bg-card/80 backdrop-blur-xl rounded-2xl px-5 py-3 border border-border shadow-apple">
            <Search className="text-muted-foreground mr-3" size={24} />
            <input 
              type="text" 
              placeholder="Buscar por nombre de empresa o país..." 
              className="bg-transparent border-none outline-none w-full text-foreground text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map(company => (
              <Link 
                to={`/${company.id}/book`} 
                key={company.id}
                className="glass rounded-3xl p-6 shadow-apple hover:shadow-lg transition-all group border border-border/50 hover:border-primary/50 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full -z-10 group-hover:scale-125 transition-transform duration-500" />
                
                <div className="w-16 h-16 bg-secondary text-foreground rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <CarFront size={32} />
                </div>
                
                <h3 className="text-2xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {company.name}
                </h3>
                
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{company.country || 'Ubicación no especificada'}</span>
                  </div>
                </div>
                
                <div className="mt-8 flex items-center text-primary font-medium text-sm group-hover:underline">
                  Ver flota disponible &rarr;
                </div>
              </Link>
            ))}

            {filteredCompanies.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground text-lg">No se encontraron empresas con ese nombre.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-6 border-t border-border bg-card/50 text-center">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Directorio Global de Rent-A-Cars.
        </p>
      </footer>
    </div>
  );
};
